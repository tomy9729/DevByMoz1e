<template>
    <DxForm :formData="userFormData" />
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
</style>