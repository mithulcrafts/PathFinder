// migrate.ts
// Runs constraints.cypher then indexes.cypher against AuraDB.
// Safe to run multiple times — all statements use IF NOT EXISTS.
//
//  add to package.json scripts:
//
// Always run migrate before upload-seeds.
// After running, verify in Neo4j Browser or AuraDB Query tab:
//   SHOW CONSTRAINTS
//   SHOW INDEXES
// All statuses should be ONLINE before proceeding.


import neo4j, { type Session } from 'neo4j-driver'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import "../config/env.js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ============================================================
// Validate environment variables before attempting connection
// ============================================================

const NEO4J_URI = process.env['NEO4J_URI']
const NEO4J_USERNAME = process.env['NEO4J_USERNAME']
const NEO4J_PASSWORD = process.env['NEO4J_PASSWORD']

if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
    console.error('ERROR: Missing required environment variables.')
    console.error('Required: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD')
    console.error('Check your .env file.')
    process.exit(1)
}
// Parse cypher file into individual statements
// Splits on semicolons, trims whitespace, removes
// empty strings and comment-only lines.

function parseCypherStatements(fileContent: string): string[] {
    return fileContent
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => {
            // Remove empty strings
            if (statement.length === 0) return false

            // Remove statements that are only comments or whitespace
            // after stripping comment lines
            const withoutComments = statement
                .split('\n')
                .filter(line => !line.trim().startsWith('//'))
                .join('\n')
                .trim()

            return withoutComments.length > 0
        })
}

// Execute a list of cypher statements against an open session
// Logs each statement as it runs.
// Throws on first failure — does not continue after error.

async function executeStatements(
    session: Session,
    statements: string[],
    fileName: string
): Promise<void> {
    console.log(`\nExecuting ${statements.length} statements from ${fileName}...\n`)

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (!statement) {
            continue
        }

        // Extract a short description from the first comment line
        // above the statement for readable logging
        const firstLine = statement.split('\n')[0]?.trim() ?? ''
        const label = firstLine.startsWith('//')
            ? firstLine.replace('//', '').trim()
            : `Statement ${i + 1}`

        try {
            await session.run(statement as string)
            console.log(`  ✓ ${label}`)
        } catch (error) {
            // Neo4j throws if a constraint or index already exists without IF NOT EXISTS
            // Since we use IF NOT EXISTS everywhere this should not happen,
            // but we handle it explicitly just in case
            const message = error instanceof Error ? error.message : String(error)

            // If the error is about an already existing constraint or index,
            // treat it as a warning not a failure — migration is still safe
            if (
                message.includes('already exists') ||
                message.includes('An equivalent index already exists')
            ) {
                console.warn(`  ⚠ Already exists (skipping): ${label}`)
                continue
            }

            // Any other error is a real failure — log and throw
            console.error(`  ✗ FAILED: ${label}`)
            console.error(`    Error: ${message}`)
            throw error
        }
    }

    console.log(`\n${fileName} complete.\n`)
}

// Verify migration succeeded by counting constraints and indexes

async function verifyMigration(session: Session): Promise<void> {
    console.log('Verifying migration...\n')

    // Count constraints
    const constraintResult = await session.run('SHOW CONSTRAINTS')
    const constraints = constraintResult.records
    console.log(`  Constraints created: ${constraints.length}`)

    // Log each constraint name and status
    for (const record of constraints) {
        const name = record.get('name') as string
        const type = record.get('type') as string
        console.log(`    - ${name} (${type})`)
    }

    console.log('')

    // Count indexes
    const indexResult = await session.run('SHOW INDEXES')
    const indexes = indexResult.records

    // Separate out online vs still building
    const onlineIndexes = indexes.filter(
        r => (r.get('state') as string) === 'ONLINE'
    )
    const populatingIndexes = indexes.filter(
        r => (r.get('state') as string) === 'POPULATING'
    )

    console.log(`  Indexes total: ${indexes.length}`)
    console.log(`  Indexes ONLINE: ${onlineIndexes.length}`)

    if (populatingIndexes.length > 0) {
        console.warn(
            `  Indexes still building (POPULATING): ${populatingIndexes.length}`
        )
        console.warn(
            '  Wait a few seconds and run SHOW INDEXES in Neo4j Browser to confirm all reach ONLINE status.'
        )
    }

    // Log each index name, type and state
    for (const record of indexes) {
        const name = record.get('name') as string
        const type = record.get('type') as string
        const state = record.get('state') as string
        const stateIcon = state === 'ONLINE' ? '✓' : '⚠'
        console.log(`    ${stateIcon} ${name} (${type}) — ${state}`)
    }

    console.log('')
}

// Main migration function

async function migrate(): Promise<void> {
    console.log('Neo4j Migration — AI Memory Marketplace')
    console.log(`URI: ${NEO4J_URI}`)
    console.log(`User: ${NEO4J_USERNAME}`)
    console.log('')

    // Create driver — use neo4j+s for AuraDB (TLS required)
    // Use neo4j for local development without TLS
    const driver = neo4j.driver(
        NEO4J_URI as string,
        neo4j.auth.basic(NEO4J_USERNAME as string, NEO4J_PASSWORD as string),
        {
            // Maximum connection lifetime — AuraDB closes idle connections
            // after a period so we set this to avoid stale connections
            maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours

            // Connection pool size — 10 is sufficient for migration script
            maxConnectionPoolSize: 10,

            // Connection acquisition timeout
            connectionAcquisitionTimeout: 30_000,

            // Log warnings from the driver
            logging: {
                level: 'warn',
                logger: (level, message) => console.warn(`[neo4j driver] ${level}: ${message}`)
            }
        }
    )

    // Test connectivity before attempting migration
    console.log('Testing connection...')
    try {
        await driver.verifyConnectivity()
        console.log('Connection verified.\n')
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Connection failed: ${message}`)
        console.error('Check NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD in your .env file.')
        await driver.close()
        process.exit(1)
    }

    // Open a single session for the entire migration
    // Use system database for constraint and index creation
    // on some Neo4j versions — AuraDB uses the default database
    const session = driver.session()

    try {
        // Step 1 — Run constraints.cypher
        // Must run before indexes because some index types require
        // the uniqueness constraints to exist first.

        const constraintsPath = resolve(__dirname, '../../db/constraints.cypher')
        console.log(`Reading constraints from: ${constraintsPath}`)

        const constraintsContent = await readFile(constraintsPath, 'utf-8')
        const constraintStatements = parseCypherStatements(constraintsContent)

        await executeStatements(session, constraintStatements, 'constraints.cypher')

        // Step 2 — Run indexes.cypher
        // Runs after constraints to avoid dependency issues.
        // The vector index requires the embedding property to be
        // defined — it will be populated during seeding and
        // onboarding but the index can be created before data exists.

        const indexesPath = resolve(__dirname, '../../db/indexes.cypher')
        console.log(`Reading indexes from: ${indexesPath}`)

        const indexesContent = await readFile(indexesPath, 'utf-8')
        const indexStatements = parseCypherStatements(indexesContent)

        await executeStatements(session, indexStatements, 'indexes.cypher')

        // Step 3 — Verify everything was created correctly

        await verifyMigration(session)

        console.log('================================================')
        console.log('Migration completed successfully.')
        console.log('You can now run: npm run upload-seeds -- <journey-file.json>')
        console.log('================================================')

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('\n================================================')
        console.error('Migration FAILED.')
        console.error(`Error: ${message}`)
        console.error('Fix the error above and run migrate again.')
        console.error('================================================')
        process.exit(1)

    } finally {
        // Always close session and driver regardless of success or failure
        await session.close()
        await driver.close()
        console.log('\nConnection closed.')
    }
}

// Run migration

migrate()