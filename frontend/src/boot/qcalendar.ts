// Boot file para QCalendar
import { boot } from 'quasar/wrappers'
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarMonth.sass'

export default boot(({ app }) => {
  app.component('QCalendarMonth', QCalendarMonth)
})

