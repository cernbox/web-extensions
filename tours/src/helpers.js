import Shepherd from 'shepherd.js'
// import { $gettext } from 'web-app-files/src/router/utils'

// FIXME we need translations for the buttons
const $gettext = function (text) {
  return text
}

export const loadTours = async (locations = []) => {
  const tours = []
  for (const l of locations) {
    const folderPath = l.substring(0, l.lastIndexOf("/"));
    if (l.split('.').pop() === 'json') {
      try {
        const response = await fetch(l)
        if (response.ok) {
          const tour = await response.json()
          tours.push(replaceFolderPlaceholders(tour, folderPath))
        }
      } catch (e) {
        console.error(`Failed to load tours '${l}' is not a valid json file.`)
      }
    }
  }
  return { tours }
}

// Recursive function to replace placeholders
function replaceFolderPlaceholders(obj, folder) {
  if (Array.isArray(obj)) {
    return obj.map(item => replaceFolderPlaceholders(item, folder));
  } else if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = replaceFolderPlaceholders(obj[key], folder);
    }
    return newObj;
  } else if (typeof obj === "string") {
    return obj.replace(/{folder}/g, folder);
  }
  return obj;
}

/* autostarts the first tour of the tours array with autostart property if the current location matches tour settings for autostart */
export async function autostartTours(tourInfos, location, token, userId) {

  if (Shepherd.activeTour) {
    return
  }

  const autostartTours = tourInfos.filter((t) => t.autostart?.location === location)
  if (autostartTours[0]) {
    const t = autostartTours[0]

    if (location !== t.autostart.location) {
      return
    }

    const tourDone = await isTourAutostartDone(t.tourId, token, userId)
    localStorage.setItem('tours/' + t.tourId, tourDone)
    if (tourDone) {
      return
    }

    const tourCompleted = () => {
      saveTourAutostart(t.tourId, token, userId).catch((err) => console.log(err))
    }

    setTimeout(() => {
      // save autostart event to local storage to prevent multiple autostarts at opening the app
      if (localStorage.getItem('tours/' + t.tourId) === "false" && location === t.autostart.location) {
        localStorage.setItem('tours/' + t.tourId, "true")
        const tour = createTranslatedTour(t)
        tour.start()
        tour.on('cancel', tourCompleted)
        tour.on('complete', tourCompleted)
      }
    }, t.autostart.timeout)
  }
}

async function saveTourAutostart(tourId, token, userId) {
  const headers = new Headers()
  headers.append('Authorization', 'Bearer ' + token)
  headers.append('X-Requested-With', 'XMLHttpRequest')

  const formData = new FormData()
  formData.append('key', tourId)
  formData.append('ns', userId)
  formData.append('value', true)
  const response = await fetch('/preferences', {
    method: 'POST',
    headers,
    body: formData
  })

  if (!response.ok) {
    const message = `An error has occured by saving tourAutostart: ${response.status}`
    throw new Error(message)
  }
}

async function isTourAutostartDone(tourId, token, userId) {
  const headers = new Headers()
  headers.append('Authorization', 'Bearer ' + token)
  headers.append('X-Requested-With', 'XMLHttpRequest')

  try {
    const response = await fetch(
      '/preferences?' +
        new URLSearchParams({
          key: tourId,
          ns: userId
        }),
      {
        method: 'GET',
        headers
      }
    )

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.value
  } catch (error) {
    console.error(error)
    return false
  }
}

export function createTranslatedTourInfos(tours) {
  const createdTourInfos = {}
  tours.forEach((t) => {
    Object.keys(t.translations).forEach((language) => {
      const translatedTour = {
        tourName: t.translations[language].tourName,
        confirmCancel: t.confirmCancel,
        confirmCancelMessage: t.confirmCancelMessage,
        classPrefix: t.classPrefix,
        exitOnEsc: t.exitOnEsc,
        useModalOverlay: t.useModalOverlay === true,
        tooltip: t.translations[language].tooltip,
        tourId: t.tourId,
        autostart: t.autostart,
        allowedLocations: t.allowedLocations,
        deniedLocations: t.deniedLocations,
        defaultLanguage: t.defaultLanguage,
        defaultStepOptions: {
          ...(t.defaultStepOptions?.cancelIcon && {
            cancelIcon: {
              enabled: t.defaultStepOptions?.cancelIcon || false
            }
          }),
          ...(t.defaultStepOptions?.classes && { classes: t.defaultStepOptions?.classes }),
          ...(t.defaultStepOptions?.scrollTo && { scrollTo: t.defaultStepOptions.scrollTo })
        },
        preloadImages: t.preloadImages || [],
        steps: []
      }

      const style = document.createElement("style");
      const steps = t.translations[language].steps
      steps.forEach((s, j) => {
        const buttons = addButtons(
          s.buttons,
          s.learnMoreName,
          s.learnMoreLink,
          j === steps.length - 1)
        const stepId = `step-${t.tourId}-${j}`;
        translatedTour.steps.push({
          title: s.title,
          classes: s.style ? `step-${s.style}` : 'step-normal',
          attachTo: s.attachTo,
          text: s.text,
          buttons: buttons,
          id: stepId,
        })
        if (s.style == "cover") {
          translatedTour.preloadImages.push(s.coverImage)
          style.innerHTML += `
            dialog[data-shepherd-step-id="${stepId}"].step-cover .shepherd-header {
              background-image: url('${s.coverImage}');
              background-size: cover;
            }
          `;
        }
      })
      document.head.appendChild(style);

      if (!createdTourInfos[language]) createdTourInfos[language] = []
      createdTourInfos[language].push(translatedTour)
    })
  })
  return createdTourInfos
}

export function createTranslatedTour(tourInfo) {
  const tour = new Shepherd.Tour({
    tourName: tourInfo.tourName,
    confirmCancel: tourInfo.confirmCancel,
    confirmCancelMessage: tourInfo.confirmCancelMessage,
    classPrefix: tourInfo.classPrefix,
    exitOnEsc: tourInfo.exitOnEsc,
    useModalOverlay: tourInfo.useModalOverlay === true,
    tooltip: tourInfo.tooltip,
    tourId: tourInfo.tourId,
    autostart: tourInfo.autostart,
    allowedLocations: tourInfo.allowedLocations,
    deniedLocations: tourInfo.deniedLocations,
    defaultLanguage: tourInfo.defaultLanguage,
    defaultStepOptions: {
      ...(tourInfo.defaultStepOptions?.cancelIcon && {
        cancelIcon: {
          enabled: tourInfo.defaultStepOptions?.cancelIcon || false
        }
      }),
      ...(tourInfo.defaultStepOptions?.classes && {
        classes: tourInfo.defaultStepOptions?.classes
      }),
      ...(tourInfo.defaultStepOptions?.scrollTo && {
        scrollTo: tourInfo.defaultStepOptions.scrollTo
      })
    }
  })

  tour.addSteps(tourInfo.steps)

  // preload images to avoid them loading only when the step is shown
  tourInfo.preloadImages.forEach(url => {
    const img = new Image()
    img.src = url
  })

  return tour
}

function addButtons(buttons, learnMoreName, learnMoreLink, isLastStep = false) {
  const actionButtons = []

  learnMoreLink &&
    actionButtons.push({
      action() {
        return window.open(learnMoreLink, '_blank').focus()
      },
      classes: 'oc-button oc-button-m oc-button-passive',
      text: learnMoreName ? learnMoreName : $gettext('Learn more'),
      secondary: true
    })

  if (buttons.includes('back'))
    actionButtons.push({
      action() {
        return this.back()
      },
      classes: 'oc-button oc-button-m oc-button-passive',
      text: $gettext('Back'),
      secondary: true
    })

  if (buttons.includes('next'))
    actionButtons.push({
      action() {
        return this.next()
      },
      classes: 'oc-button oc-button-m oc-button-primary',
      text: isLastStep ? $gettext('Close') : $gettext('Next')
    })

  return actionButtons
}
