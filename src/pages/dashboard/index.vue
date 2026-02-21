<script setup lang='ts'>

definePageMeta({
    layout: 'dashboard'
})

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

</script>

<template>
</template>

<style lang='scss' scoped></style>