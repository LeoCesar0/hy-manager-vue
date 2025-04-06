<script setup>
// Index page component
</script>

<template>
  <NuxtLayout name="home">
    <div class="home-page">
      <h1>Home Page</h1>
      <NuxtLink to="/dashboard">
        <UiButton>Dashboard</UiButton>
      </NuxtLink>
    </div>
  </NuxtLayout>
</template>
