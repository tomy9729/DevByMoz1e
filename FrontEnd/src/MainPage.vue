<template>
    <div class="MainPage-root">
        <div class="MainPage-left">
            <DxList
                :dataSource="listItems"
                :searchEnabled="true"
                keyExpr="key"
                displayExpr="text"
                searchExpr="text"
                selectionMode="single"
                :onItemClick="onComponentListItemClick"
            />
        </div>
        <div class="MainPage-right">
            <component :is="componentName" />
        </div>
    </div>
</template>

<script>
import DxList from 'devextreme-vue/list'

import LoginPage from "@/user/LoginPage.vue"

export default {
  name: "MainPage",
  components:{
    DxList,
    LoginPage,
  },
  data(){
    return{
        componentName : null,
        listItems : [
            {
                key: "Login Page",
                text : "Login Page",
                component : "LoginPage"
            }
        ]
    }
  },
  methods:{
    onComponentListItemClick(e){
        this.componentName = e.itemData.component
    }
  }
}
</script>

<style>
.MainPage-root{
    display: flex;
    height: 100%;
    width : 100%;
}
.MainPage-left{
    width : 30%;
}
.MainPage-right{
    display: flex;
    align-items: center;
    width : 70%;
}
</style>