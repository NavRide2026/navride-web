"use client";

import { useEffect } from "react";

const SNAP_ERROR = /Este camino no está disponible en los datos de routing actuales\s*\(snap\s*>\s*\d+\s*m\)\.\s*Usa LÍNEA DIRECTA o elige un punto más cercano al graph\.?/i;
const FRIENDLY_SNAP_ERROR = "No encontramos una carretera o camino cerca de este punto. Acerca el punto a una vía o usa «Línea directa» para continuar.";

function humanizeRoutingCopy(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) nodes.push(current as Text);
  for (const node of nodes) {
    if (node.nodeValue && SNAP_ERROR.test(node.nodeValue)) {
      node.nodeValue = FRIENDLY_SNAP_ERROR;
    }
  }
}

/** Replaces internal routing jargon with clear Spanish copy in the visual editor. */
export default function RouteStudioCopy() {
  useEffect(() => {
    humanizeRoutingCopy(document.body);
    const observer = new MutationObserver(() => humanizeRoutingCopy(document.body));
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
