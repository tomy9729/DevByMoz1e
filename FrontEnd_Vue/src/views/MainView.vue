<template>
    <div class="main-view">
        <header class="main-header">
            <div class="main-header-left">
                <img
                    class="loa-calendar-logo-icon"
                    :src="lostarkCalendarIcon"
                    alt=""
                />
                <span class="main-project-name">로아 캘린더</span>
            </div>

            <SelectButton
                v-model="currentMenuId"
                :options="menuItems"
                option-label="label"
                option-value="id"
                data-key="id"
                class="main-menu"
                :allow-empty="false"
            >
                <template #option="slotProps">
                    <span class="main-menu-option">
                        <i
                            :class="slotProps.option.icon"
                            aria-hidden="true"
                        ></i>
                        <span>{{ slotProps.option.label }}</span>
                    </span>
                </template>
            </SelectButton>

            <div class="main-header-right" aria-hidden="true"></div>
        </header>

        <main class="main-page-area">
            <component :is="currentPageComponent" />
        </main>
    </div>
</template>

<script setup lang="ts">
import type { Component } from "vue"
import { computed, ref } from "vue"
import lostarkCalendarIcon from "@/assets/lostark_calendar_icon.png"
import Page_Calendar from "@/calander/Page_Calendar.vue"
import Page_Test from "@/views/Page_Test.vue"
import SelectButton from "primevue/selectbutton"

interface MainMenuItem {
    id: string
    label: string
    icon: string
    pageComponent: Component
}

defineOptions({
    name: "MainView",
})

const currentMenuId = ref("calendar")

const menuItems: MainMenuItem[] = [
    {
        id: "calendar",
        label: "캘린더",
        icon: "pi pi-calendar",
        pageComponent: Page_Calendar,
    },
    {
        id: "test",
        label: "테스트",
        icon: "pi pi-box",
        pageComponent: Page_Test,
    },
]

const currentMenuItem = computed(() => {
    return (
        menuItems.find((menuItem) => menuItem.id === currentMenuId.value) ??
        menuItems[0]
    )
})

const currentPageComponent = computed(() => {
    return currentMenuItem.value?.pageComponent ?? null
})
</script>
