<template>123</template>

<script>
import Highcharts from "highcharts"
// for noData
import nodata from "highcharts/modules/no-data-to-display"
// for exporting
import exportingInit from "highcharts/modules/exporting"
import offlineExporting from "highcharts/modules/offline-exporting"
// for gauge chart
import highchartsMore from "highcharts/highcharts-more"
import solidGauge from "highcharts/modules/solid-gauge"

import "devextreme/dist/css/dx.light.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "material-icons/iconfont/material-icons.css"

{
    Highcharts.setOptions({
        title: {
            text: null,
        },
        credits: {
            enabled: false,
        },
        accessibility: {
            enabled: false,
        },
        time: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            useUTC: false,
        },
    })
    nodata(Highcharts)
    exportingInit(Highcharts)
    offlineExporting(Highcharts)
    highchartsMore(Highcharts)
    solidGauge(Highcharts)
}
export default {
    name: "App",

    components: {},

    provide: {},
}
</script>
