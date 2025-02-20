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
      this.currentTranslatedTourInfos = this.translatedTourInfos[language] || []
      console.log('currentTranslatedTourInfos', this.currentTranslatedTourInfos)
    }
  },
})
