<template>
    <div class="myCard-root">
        <div class="myCard-image">
        </div>
        <div class="myCard-title">
            {{ title }}
        </div>
    </div>
</template>

<script>
export default {
    name : "MyCard",
    props:{
        title : {type:String, default : "No Title"}
    }
}
</script>

<style>
.myCard-root{
    border: 1px solid black;
    box-shadow: 0px 10px 20px rgba(0,0,0,0.19), 0px 6px 6px rgba(0,0,0,0.23);
    height: 100%;
    width: 100%;
}
.myCard-image{
    height : calc(100% - 30px)
}
.myCard-title{
    height:30px;
}
</style>