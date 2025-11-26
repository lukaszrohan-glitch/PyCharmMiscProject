export const translations = {
  en: {
    app_title: 'SMB Tool',
    // ...rest of existing English translations...
  },
  pl: {
    app_title: 'Narzędzie SMB',
    // ...rest of existing Polish translations...
  }
}

export function translateStatus(lang, status) {
  const map = {
    pl: { New: 'Nowe', Planned: 'Planowane', InProd: 'W produkcji', Done: 'Gotowe', Invoiced: 'Zafakturowane' },
    en: { New: 'New', Planned: 'Planned', InProd: 'InProd', Done: 'Done', Invoiced: 'Invoiced' }
  }
  return (map[lang] && map[lang][status]) || status
}
