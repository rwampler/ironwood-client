<template lang='pug'>
#auth-root
  .brand Ironwood

  .message(v-if='message') {{message}}

  template(v-if='account')
    .is-flex.is-justify-content-space-between.is-align-items-center
      span Logged in as {{account.username}}
      button.button(@click.stop.prevent='logout' :class="{'is-loading': loading}" :disabled='loading || !canLogout') Logout

  template(v-else-if="mode == 'LOGIN'")
    .field
      p.control.has-icons-left
        input.input(type='text' placeholder='Username' :disabled='loading' v-model='username')
        span.icon.is-small.is-left
          font-awesome-icon(:icon="['fas', 'envelope']")

    .field
      .p.control.has-icons-left
        input.input(type="password" placeholder="Password" :disabled='loading' v-model='password')
        span.icon.is-small.is-left
          font-awesome-icon(:icon="['fas', 'lock']")

    .field
      p.control.is-flex.is-justify-content-space-between.is-align-items-center
        a(@click.stop.prevent="setMode('CREATE')") Create Account
        a.mx-6(@click.stop.prevent="setMode('RESET')") Reset Password
        button.button.is-ironwood(@click.stop.prevent='login' :class="{'is-loading': loading}" :disabled='loading || !canLogin') Login

  template(v-else-if="mode == 'CREATE'")
    .field
      p.control.has-icons-left
        input.input(type='text' placeholder='Username' :disabled='loading' v-model='username')
        span.icon.is-small.is-left
          font-awesome-icon(:icon="['fas', 'envelope']")

    .field
      .p.control.has-icons-left
        input.input(type="password" placeholder="Password" :disabled='loading' v-model='password')
        span.icon.is-small.is-left
          font-awesome-icon(:icon="['fas', 'lock']")

    .field
      .p.control.has-icons-left
        input.input(type="password" placeholder="Confirm Password" :disabled='loading' v-model='passwordConfirmation')
        span.icon.is-small.is-left
          font-awesome-icon(:icon="['fas', 'lock']")

    .field
      p.control.is-flex.is-justify-content-space-between.is-align-items-center
        span(v-if='loading') Cancel
        a(v-else @click.stop.prevent="setMode('LOGIN')") Cancel
        button.button.is-ironwood(@click.stop.prevent='create' :class="{'is-loading': loading}" :disabled='loading || !canCreate') Create

  template(v-else-if="mode == 'RESET'")
    .field
      p.control.has-icons-left
        input.input(type='text' placeholder='Username' :disabled='loading' v-model='username')
        span.icon.is-small.is-left
          font-awesome-icon(:icon="['fas', 'envelope']")

    .field
      p.control.is-flex.is-justify-content-space-between.is-align-items-center
        span(v-if='loading') Cancel
        a(v-else @click.stop.prevent="setMode('LOGIN')") Cancel
        button.button.is-ironwood(@click.stop.prevent='reset' :class="{'is-loading': loading}" :disabled='loading || !canReset') Reset

</template>

<script>
import _ from 'lodash';

import AccountManager from '~/plugins/ironwood/account/account-manager';
import ServerManager from '~/plugins/ironwood/server/server-manager';
import State from '~/plugins/ironwood/state';


export default {
  props: {
    accountManager: { type: AccountManager, required: true },
    serverManager: { type: ServerManager, required: true },
    state: { type: State, required: true }
  },

  data () {
    return {
      mode: 'LOGIN',

      message: null,
      loading: false,

      username: null,
      password: null,
      passwordConfirmation: null
    };
  },

  computed: {
    canLogin () { return _.trim(this.username).length > 0 && _.trim(this.password).length > 0; },
    canCreate () { return _.trim(this.username).length > 0 && _.trim(this.password).length > 0 && _.trim(this.password) === _.trim(this.passwordConfirmation); },
    canReset () { return false && _.trim(this.username).length > 0; },
    canLogout () { return this.account != null; },

    account () { return this.state.account; }
  },

  methods: {
    setMode (mode) {
      if (this.loading) return;
      this.resetForm(mode);
    },

    resetForm (mode = 'LOGIN') {
      this.username = null;
      this.password = null;
      this.passwordConfirmation = null;
      this.mode = mode;
    },

    async login () {
      if (this.loading || !this.canLogin) return;
      try {
        this.loading = true;
        await this.accountManager.login(this.username, this.password);
        this.resetForm('LOGIN');

        this.serverManager.connect();
      }
      catch (err) {
        console.error(err);
      }
      finally {
        this.loading = false;
      }
    },

    async create () {
      if (this.loading || !this.canCreate) return;
      try {
        this.loading = true;
        await this.accountManager.create(this.username, this.password);
        this.resetForm('LOGIN');

        this.serverManager.connect();
      }
      catch (err) {
        console.error(err);
      }
      finally {
        this.loading = false;
      }
    },

    async reset () {
      if (this.loading || !this.canReset) return;
    },

    async logout () {
      if (this.loading || !this.canLogout) return;
      try {
        this.loading = true;
        await this.accountManager.logout();
        this.resetForm('LOGIN');
      }
      catch (err) {
        console.error(err);
      }
      finally {
        this.loading = false;
      }
    },
  }
}
</script>


<style lang='sass' scoped>
@import 'bulma/sass/utilities/_all'
@import '~/assets/stylesheets/ironwood'

#auth-root
  border: 1px solid $primary-color
  border-radius: .5rem
  color: $primary-color
  padding: 1rem
  pointer-events: auto
  position: relative
  margin-top: -25vh

.brand
  align-items: center
  display: flex
  font-size: 3rem
  font-weight: bold
  justify-content: center
  letter-spacing: .5rem
  line-height: 1
  padding-bottom: 2rem

input
  &:focus
    box-shadow: 0 0 0 0.0625em darken($primary-color, 15%)

  &.input
    min-width: 26rem

</style>
