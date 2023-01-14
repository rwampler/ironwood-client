<template lang='pug'>
#container-main
  #container-main-menu
    main-menu-panel(v-if='isRunning' :state='state')
  #container-render
  #container-render-curtain(:class="{'hidden': isRunning}")
  #container-status-bar
    status-bar-panel(v-if='isRunning' :state='state')


  #container-menu
    authentication-portal(v-if='isPendingAccount' :account-manager='accountManager' :server-manager='serverManager' :state='state')

  #container-loading(v-show='isPendingMetadata || isPendingAssets || isPendingInitialize')
    .background
    .foreground.is-flex.is-flex-direction-column
      font-awesome-icon.fa-spin(:icon="['fas', 'gear']")
      span(v-show='isPendingMetadata') Loading...
      span(v-show='isPendingAssets') Loading Assets...
      span(v-show='isPendingInitialize') Initializing...

</template>

<script>
import State, { Status } from '~/plugins/ironwood/state';
import Client from '~/plugins/ironwood/client';

import { reactive } from 'vue';

const state = reactive(new State());
const client = new Client("container-render", state);
const animate = (time) => {
  client?.tick(time);
  requestAnimationFrame((time) => animate(time));
}

export default {
  data () {
    return {
      state: state,

      loading: false,
      initializing: false
    };
  },

  mounted () {
    if (client) {
      this.load();
    }
  },

  computed: {
    isPendingMetadata () { return this.state.status === Status.PENDING_METADATA; },
    isPendingAccount () { return this.state.status === Status.PENDING_ACCOUNT; },
    isPendingAssets () { return this.state.status === Status.PENDING_ASSETS; },
    isPendingInitialize () { return this.state.status === Status.PENDING_INITIALIZE; },
    isRunning () { return this.state.status === Status.RUNNING; },

    accountManager () { return client?.accountManager; },
    serverManager () { return client?.serverManager; }
  },

  methods: {
    async load () {
      if (this.loading) return;
      try {
        this.loading = true;
        await this.serverManager.loadMetadata();
        this.initialize();
      }
      catch (err) {
        console.error(err);
        setTimeout(() => this.load(), 1000);
      }
      finally {
        this.loading = false;
      }
    },

    async initialize () {
      if (this.initializing) return;
      try {
        this.initializing = true;
        await client.initialize();
        animate(performance.now());
      }
      catch (err) {
        console.error(err);
        setTimeout(() => this.initialize(), 1000);
      }
      finally {
        this.initializing = false;
      }
    }
  }
}
</script>


<style lang='sass' scoped>
@import 'bulma/sass/utilities/_all'
@import '~/assets/stylesheets/ironwood'


#container-main
  display: grid
  height: 100%
  grid-template-columns: 20vw 80vw
  grid-template-rows: calc(100vh - 2.5rem) 2.5rem
  width: 100%

#container-loading
  align-items: center
  display: flex
  grid-area: 1 / 1 / span 1 / span 2
  justify-content: center
  position: relative
  z-index: 2000

  .background
    background-color: rgba(0, 0, 0, 25%)
    height: 100%
    position: absolute
    width: 100%

  .foreground
    align-items: center
    border: 1px solid $primary-color
    border-radius: .5rem
    color: $primary-color
    display: inline-flex
    font-size: 10rem
    justify-content: center
    margin-top: -25vh
    padding: 4rem

    span
      font-size: 1.75rem
      font-style: italic
      padding-top: 2rem

#container-main-menu
  grid-area: 1 / 1 / span 2 / span 1
  position: relative
  z-index: 100

#container-render
  grid-area: 1 / 2 / span 1 / span 1
  position: relative
  z-index: 100
  user-select: none

#container-render-curtain
  background-color: #111111
  grid-area: 1 / 2 / span 1 / span 1
  opacity: 1
  pointer-events: none
  position: relative
  transition: opacity 1s
  z-index: 100

  &.hidden
    opacity: 0

#container-status-bar
  grid-area: 2 / 2 / span 1 / span 1
  position: relative
  z-index: 100

#container-menu
  align-items: center
  display: flex
  flex-direction: column
  justify-content: center
  grid-area: 1 / 1 / span 1 / span 2
  pointer-events: none
  position: relative
  z-index: 1000

</style>
