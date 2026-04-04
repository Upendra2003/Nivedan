/**
 * Web stub — NativePdfRenderer is only used in the native pdf-viewer route.
 * On web, the existing PdfViewer modal (iframe) handles PDF rendering.
 */
import React from "react";
import { Text, View } from "react-native";

interface Props {
  pdfBase64: string;
}

export default function NativePdfRenderer({ pdfBase64: _ }: Props) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#888", fontSize: 13 }}>
        Native PDF renderer — not used on web.
      </Text>
    </View>
  );
}
