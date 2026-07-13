import { SchemaType, type Schema } from "@google/generative-ai";

export const partialJourneyDraftSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        experiences: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: {
                        type: SchemaType.STRING,
                    },
                    startDate: {
                        type: SchemaType.STRING,
                        description: "Format: MM YYYY. Example: 01 2024",
                    },
                    endDate: {
                        type: SchemaType.STRING,
                        description: "Format: MM YYYY. Example: 08 2024",
                    },
                    context: {
                        type: SchemaType.STRING,
                    },
                    challengeFaced: {
                        type: SchemaType.STRING,
                    },
                    outcome: {
                        type: SchemaType.STRING,
                    },
                    organization: {
                        type: SchemaType.STRING,
                    },
                    applicationStatus: {
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
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.STRING,
                        },
                    },
                    skills: {
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
                        },
                    },
                    timelineSummary: {
                        type: SchemaType.STRING,
                    },
                    decisionReason: {
                        type: SchemaType.STRING,
                    },
                },
                required: [
                    "title",
                    "context",
                    "timelineSummary",
                ],
            },
        },
    },
    required: [
        "experiences",
    ],
};