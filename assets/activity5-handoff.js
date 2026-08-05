(function initializeActivity5Handoff(root) {
  const STORAGE_KEY = "ecmis-a4-a5-handoffs-v1";
  const ELIGIBLE_DECISIONS = new Set(["18/1ก", "18/1ข", "18/4"]);

  function read(storage) {
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      return parsed.schemaVersion === 1 && parsed.records && typeof parsed.records === "object"
        ? parsed
        : { schemaVersion: 1, records: {} };
    } catch {
      return { schemaVersion: 1, records: {} };
    }
  }

  function activity5CaseId(sourceReference) {
    return `A5-${String(sourceReference || "").replace(/[^0-9A-Za-zก-๙_-]/g, "-")}`;
  }

  function hasDispatchEvidence(handoff) {
    return Boolean(
      handoff?.outgoingLetterNo
      && handoff?.outgoingLetterDate
      && handoff?.destinationUnit
      && handoff?.dispatchedAt
    );
  }

  function isEligible(state, dispatchingRole = "officer") {
    return Boolean(
      state?.workflow?.complete
      && state?.workflow?.stage === "activity5-dispatch"
      && ["officer", "regional-officer"].includes(dispatchingRole)
      && ELIGIBLE_DECISIONS.has(state?.documentData?.decision)
      && state?.documentData?.dispatchConfirmedAt
      && state?.documentData?.dispatchLetterNo
      && state?.documentData?.dispatchLetterDate
      && state?.documentData?.dispatchSentDate
      && state?.documentData?.dispatchDestinationUnit
    );
  }

  function create(storage, state, dispatchedAt = new Date().toISOString(), dispatchingRole = "officer") {
    if (!isEligible(state, dispatchingRole)) return { created: false, eligible: false, handoff: null };

    const source = state.caseData || {};
    const sourceReference = String(source.id || "").trim();
    if (!sourceReference) return { created: false, eligible: false, handoff: null };

    const store = read(storage);
    if (hasDispatchEvidence(store.records[sourceReference])) {
      return { created: false, eligible: true, handoff: store.records[sourceReference] };
    }

    const handoff = {
      handoffId: `activity4:${sourceReference}:activity5`,
      activity5CaseId: activity5CaseId(sourceReference),
      sourceReference,
      sourceDecision: state.documentData.decision,
      receivedDate: String(source.received || ""),
      title: String(source.subject || ""),
      complainant: String(source.complainant || ""),
      agency: String(source.agency || ""),
      unit: String(source.region || ""),
      signedDocumentVersion: state.documentVersions?.at(-1)?.version || null,
      approvedAt: String(state.documentData.approvedAt || ""),
      approvedBy: String(state.documentData.approvedBy || ""),
      appointmentOrder: String(state.documentData.actingOrder || ""),
      outgoingLetterNo: String(state.documentData.dispatchLetterNo || ""),
      outgoingLetterDate: String(state.documentData.dispatchLetterDate || ""),
      dispatchMethod: String(state.documentData.dispatchSendMethod || ""),
      emsTrackingNo: String(state.documentData.dispatchEms || ""),
      dispatchProofName: String(state.documentData.dispatchProofName || ""),
      destinationUnit: String(state.documentData.dispatchDestinationUnit || ""),
      dispatchNote: String(state.documentData.dispatchNote || ""),
      dispatchedBy: "เจ้าหน้าที่รับเรื่อง ศรร.",
      dispatchedAt,
      sourceSystem: "Activity4HTMLPrototype"
    };
    store.records[sourceReference] = handoff;
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
    return { created: true, eligible: true, handoff };
  }

  const api = Object.freeze({ STORAGE_KEY, activity5CaseId, create, isEligible, read });
  root.ECMISActivity5Handoff = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis === "undefined" ? window : globalThis);
