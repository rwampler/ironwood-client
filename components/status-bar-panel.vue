<template lang='pug'>
#status-bar-panel

  .view-location
    span X: {{viewX}}
    span Y: {{viewY}}

</template>

<script>
import State from '~/plugins/ironwood/state';
import NumberUtils from '~/plugins/ironwood/util/number-utils';

export default {
  props: {
    state: { type: State, required: true }
  },

  computed: {

    viewX () { return NumberUtils.round(this.state.view?.x, 2); },
    viewY () { return NumberUtils.round(this.state.view?.y, 2); }

  },

  methods: {
  }
}
</script>


<style lang='sass' scoped>
@import '~/assets/stylesheets/ironwood'

#status-bar-panel
  align-items: center
  display: flex
  font-size: 1.25rem
  flex-direction: row
  height: 100%
  width: 100%

.view-location
  span
    &:not(:first-child)
      margin-left: .5rem

</style>
