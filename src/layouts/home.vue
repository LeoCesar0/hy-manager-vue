<script setup lang="ts">
import Navbar from "~/components/Landing/Navbar.vue";
import FooterSection from "~/components/Landing/FooterSection.vue";
</script>

<template>
  <div class="min-h-screen bg-background">
    <Navbar />
    <main>
      <slot />
    </main>
    <FooterSection />
  </div>
</template>
