const ACTIONS_BY_STATE = {
  AUTO_APPROVED: { pause: false, resume: false, allow: false, decline: false, undo: false },
  AWAITING_INPUT: { pause: true, resume: false, allow: false, decline: false, undo: false },
  AWAITING_REVIEW: { pause: true, resume: false, allow: true, decline: true, undo: false },
  PAUSED: { pause: false, resume: true, allow: false, decline: false, undo: true },
  DEMO_REVIEWED: { pause: false, resume: false, allow: false, decline: false, undo: true },
};

export function controlAvailability(controlState) {
  return ACTIONS_BY_STATE[controlState] ?? ACTIONS_BY_STATE.AUTO_APPROVED;
}
