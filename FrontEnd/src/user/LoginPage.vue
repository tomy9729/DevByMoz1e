<template>
    <div class="LoginPage-root">
        <DxForm :formData="userFormData" />
    </div>
</template>

<script>
import DxForm from "devextreme-vue/form"
import User from "./User"
export default {
  // TODO 이름 바꾸는거 고려 page
  name: "LoginPage",
  components: {
    DxForm,
  },
  data() {
    return {
      userFormData: User.getDefault(),
    }
  },
}
</script>

<style>
.LoginPage-root{
    height: 100%;
    width:100%
}
</style>