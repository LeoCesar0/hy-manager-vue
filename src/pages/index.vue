<script setup lang="ts">
import HeroSection from "~/components/Landing/HeroSection.vue";
import FeaturesSection from "~/components/Landing/FeaturesSection.vue";
import HowItWorksSection from "~/components/Landing/HowItWorksSection.vue";
import CtaSection from "~/components/Landing/CtaSection.vue";
</script>

<template>
  <NuxtLayout name="home">
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <CtaSection />
  </NuxtLayout>
</template>
