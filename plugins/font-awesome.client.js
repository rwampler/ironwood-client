import { library } from '@fortawesome/fontawesome-svg-core';

import * as far from '@fortawesome/free-regular-svg-icons';
import * as fas from '@fortawesome/free-solid-svg-icons';

library.add(far.faEnvelope);
library.add(fas.faEnvelope, fas.faGear, fas.faLock);

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon);
});
