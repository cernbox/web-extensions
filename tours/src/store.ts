import { createTranslatedTourInfos } from './helpers'
import { defineStore } from 'pinia'

export const useToursStore = defineStore('tours', {
  state: () => ({
    tours: [],
    translatedTourInfos: {},
    currentTranslatedTourInfos: []
  }),
  actions: {
    setAllTranslatedTourInfos(tourInfos: any[]) {
      this.tours = tourInfos
      this.translatedTourInfos = createTranslatedTourInfos(tourInfos) || []
    },
    setCurrentTranslatedTourInfos(languageCode?: string) {
      const language = languageCode || document.documentElement.lang
      if (this.translatedTourInfos[language]) {
        this.currentTranslatedTourInfos = this.translatedTourInfos[language]
        return
      }
      const availableLanguages = Object.keys(this.translatedTourInfos)
      const fallbackLanguage = availableLanguages.includes('en') ? 'en' : availableLanguages[0]
      this.currentTranslatedTourInfos = this.translatedTourInfos[fallbackLanguage] || []
    }
  },
})
