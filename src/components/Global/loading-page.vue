<script setup lang='ts'>
type Props = {};

const props = defineProps<Props>();
</script>

<template>
    <div class="min-h-screen flex items-center justify-center" >
        <UiSpinner class="size-20 animate-spin" />
    </div>
</template>

<style lang='scss' scoped>
.container {
    width: 100%;
}
</style>