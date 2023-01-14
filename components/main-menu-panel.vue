<template lang='pug'>
#main-menu-panel
  .simulation-time
    span {{simulationDate}}
    span {{simulationDayOfWeek}}
    span {{simulationTime}}

</template>

<script>
import State from '~/plugins/ironwood/state';

export default {
  props: {
    state: { type: State, required: true }
  },

  computed: {

    simulationDate () { return this.state.metadata?.simulation?.simulationTime?.toLocaleString({ day: '2-digit', month: '2-digit', year: 'numeric' }); },
    simulationTime () { return this.state.metadata?.simulation?.simulationTime?.toLocaleString({ hour12: true, hour: '2-digit', minute:'2-digit' }); },
    simulationDayOfWeek () { return this.state.metadata?.simulation?.simulationTime?.toLocaleString({ weekday: 'long' }); },

  },

  methods: {
  }
}
</script>


<style lang='sass' scoped>
@import '~/assets/stylesheets/ironwood'

#main-menu-panel
  display: flex
  flex-direction: column

.simulation-time
  display: flex
  flex-direction: row
  font-size: 1.8rem
  font-weight: bold
  justify-content: space-evenly
  text-align: center
  text-transform: uppercase

</style>
