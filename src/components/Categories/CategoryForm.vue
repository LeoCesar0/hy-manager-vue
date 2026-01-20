<script setup lang="ts">
import type { ICategory, ICreateCategory } from "~/@schemas/models/category";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type IProps = {
  category?: ICategory;
  loading?: boolean;
};

const props = withDefaults(defineProps<IProps>(), {
  loading: false,
});

const emit = defineEmits<{
  submit: [data: ICreateCategory];
  cancel: [];
}>();

const form = ref({
  name: props.category?.name || "",
  color: props.category?.color || "#3b82f6",
  icon: props.category?.icon || "",
});

watch(
  () => props.category,
  (newVal) => {
    if (newVal) {
      form.value.name = newVal.name;
      form.value.color = newVal.color || "#3b82f6";
      form.value.icon = newVal.icon || "";
    }
  }
);

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const handleSubmit = () => {
  if (!currentUser.value) return;

  emit("submit", {
    name: form.value.name,
    color: form.value.color || null,
    icon: form.value.icon || null,
    userId: currentUser.value.id,
  });
};

const commonIcons = ["💰", "🏠", "🚗", "🍔", "🎮", "💊", "📚", "✈️", "🛒", "💳"];
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div class="space-y-2">
      <Label for="name">Category Name</Label>
      <Input
        id="name"
        v-model="form.name"
        placeholder="e.g., Groceries, Transport"
        required
      />
    </div>

    <div class="space-y-2">
      <Label for="icon">Icon (optional)</Label>
      <Input
        id="icon"
        v-model="form.icon"
        placeholder="Choose an emoji"
        maxlength="2"
      />
      <div class="flex gap-2 flex-wrap mt-2">
        <button
          v-for="icon in commonIcons"
          :key="icon"
          type="button"
          @click="form.icon = icon"
          class="text-2xl hover:scale-125 transition-transform"
        >
          {{ icon }}
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <Label for="color">Color</Label>
      <div class="flex gap-2 items-center">
        <input
          id="color"
          type="color"
          v-model="form.color"
          class="h-10 w-20 rounded border cursor-pointer"
        />
        <Input
          v-model="form.color"
          placeholder="#000000"
          class="flex-1"
        />
      </div>
    </div>

    <div class="flex gap-2 justify-end">
      <Button type="button" variant="outline" @click="emit('cancel')">
        Cancel
      </Button>
      <Button type="submit" :disabled="loading || !form.name.trim()">
        {{ category ? "Update" : "Create" }} Category
      </Button>
    </div>
  </form>
</template>
