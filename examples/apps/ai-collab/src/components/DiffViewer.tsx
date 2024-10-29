/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

"use client";

import React from "react";
import { Card, Typography, Box } from "@mui/material";
import { Diff } from "@fluid-experimental/ai-collab";

interface DiffViewerProps {
    diffs: Diff[];
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diffs }) => {
    return (
        <Box>
            {diffs.map((diff) => (
                <Card key={diff.id} sx={{ mb: 2, p: 2 }}>
                    <Typography variant="h6">{diff.type === "error" ? "Error" : "Edit"}</Typography>
                    <Typography variant="body1">{diff.description}</Typography>
                </Card>
            ))}
        </Box>
    );
};

export default DiffViewer;
