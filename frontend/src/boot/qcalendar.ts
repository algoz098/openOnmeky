// Boot file para QCalendar
import { boot } from 'quasar/wrappers'
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.scss'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.scss'
import '@quasar/quasar-ui-qcalendar/src/QCalendarMonth.scss'

export default boot(({ app }) => {
  app.component('QCalendarMonth', QCalendarMonth)
})

