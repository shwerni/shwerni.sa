"use client";
// React & Next
import React from "react";

// components
import { Button } from "@/components/ui/button";

// lib
import { sendBulkMessage } from "@/lib/api/whatsapp/bulk";

export default function BulkSend() {
  return <Button onClick={() => sendBulkMessage()}>send bulk</Button>;
}
