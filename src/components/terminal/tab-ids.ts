/** Ids that tie a tab to its panel (aria-controls / aria-labelledby). */
export const tabId = (idBase: string, id: string) => `${idBase}-tab-${id}`
export const tabPanelId = (idBase: string, id: string) => `${idBase}-panel-${id}`
