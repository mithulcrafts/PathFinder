import { SchemaType, type Schema } from "@google/generative-ai";

export const partialJourneyDraftSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        experiences: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    experienceNumber: {
                        type: SchemaType.INTEGER,
                        description: "Existing experience number. Omit for a new experience.",
                    },
                    title: {
                        type: SchemaType.STRING,
                    },
                    startDate: {
                        nullable: true,
                        type: SchemaType.STRING,
                        description: "Format: MM YYYY. Example: 01 2024",
                    },
                    endDate: {
                        nullable: true,
                        type: SchemaType.STRING,
                        description: "Format: MM YYYY. Example: 08 2024",
                    },
                    context: {
                        type: SchemaType.STRING,
                    },
                    challengeFaced: {
                        nullable: true,
                        type: SchemaType.STRING,
                    },
                    outcome: {
                        nullable: true,
                        type: SchemaType.STRING,
                    },
                    organization: {
                        nullable: true,
                        type: SchemaType.STRING,
                    },
                    applicationStatus: {
                        nullable: true,
                        type: SchemaType.STRING,
                        format: "enum",
                        enum: [
                            "accepted",
                            "rejected",
                            "waitlisted",
                            "pending",
                        ],
                    },
                    achievements: {
                        nullable: true,
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.STRING,
                        },
                    },
                    skills: {
                        nullable: true,
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                name: {
                                    type: SchemaType.STRING,
                                },
                                type: {
                                    type: SchemaType.STRING,
                                    format: "enum",
                                    enum: [
                                        "Technical",
                                        "Soft",
                                        "Domain",
                                        "ExtraCurricular",
                                    ],
                                },
                            },
                            required: ["name", "type"],
                        },
                    },
                    timelineSummary: {
                        type: SchemaType.STRING,
                    },
                    decisionReason: {
                        nullable: true,
                        type: SchemaType.STRING,
                    },
                },
            },
        },
        removeExperienceNumbers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.INTEGER },
        },
    },
    required: [
        "experiences",
    ],
};