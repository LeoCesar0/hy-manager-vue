<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { IAnyUser } from "@common/schemas/user/user";
import { ROLE_COLORS } from "@static/colors";
import { getUserRoleLabel } from "~/helpers/getUserRoleLabel";
type Props = {
  user: IAnyUser;
};

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const props = defineProps<Props>();

const color = computed(() => {
  const c = ROLE_COLORS[props.user.role] ?? "";
  return c;
});
</script>

<template>
  <div class="flex items-center flex-start gap-1">
    <div
      :class="cn('w-3 h-3 rounded-full')"
      :style="{ backgroundColor: color }"
    ></div>
    <span class="capitalize text-muted-foreground text-sm">{{
      getUserRoleLabel({ user, reqUser: currentUser })
    }}</span>
  </div>
</template>
