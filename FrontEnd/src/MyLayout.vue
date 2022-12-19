<template>
    <div class="myLayout-root" :style="`height:${windowHeight}px`">
        <MainPage />
    </div>
</template>

<script>
import MainPage from "@/MainPage.vue"
export default {
  name: "MyLayout",
  components: {
    MainPage,
  },
   data() {
    return {
      windowHeight: 0,
    }
  },
  mounted() {
    this.windowHeight = window.innerHeight-16 //margin size 8*2
  },
}
</script>

<style>
.myLayout-root{
    width: 100%;
    height:100%;
}
</style>