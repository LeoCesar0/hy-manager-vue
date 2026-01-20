<script setup lang="ts">
import type { ITransactionCategorySplit } from "~/@schemas/models/transaction";
import type { ICategory } from "~/@schemas/models/category";
import { UiButton } from "~/components/ui/button";
import { UiInput } from "~/components/ui/input";
import { UiLabel } from "~/components/ui/label";
import {
  UiSelect,
  UiSelectContent,
  UiSelectItem,
  UiSelectTrigger,
  UiSelectValue,
} from "~/components/ui/select";

type IProps = {
  splits: ITransactionCategorySplit[];
  categories: ICategory[];
  totalAmount: number;
};

const props = defineProps<IProps>();

const emit = defineEmits<{
  "update:splits": [splits: ITransactionCategorySplit[]];
}>();

const localSplits = ref<ITransactionCategorySplit[]>([...props.splits]);

watch(
  () => props.splits,
  (newSplits) => {
    localSplits.value = [...newSplits];
  },
  { deep: true }
);

watch(
  localSplits,
  (newSplits) => {
    emit("update:splits", newSplits);
  },
  { deep: true }
);

const addSplit = () => {
  localSplits.value.push({
    categoryId: "",
    amount: 0,
  });
};

const removeSplit = (index: number) => {
  localSplits.value.splice(index, 1);
};

const totalSplitAmount = computed(() => {
  return localSplits.value.reduce((sum, split) => sum + Number(split.amount), 0);
});

const remainingAmount = computed(() => {
  return Math.abs(props.totalAmount) - totalSplitAmount.value;
});

const isValid = computed(() => {
  return Math.abs(remainingAmount.value) < 0.01;
});

const getCategoryName = (categoryId: string) => {
  const category = props.categories.find((c) => c.id === categoryId);
  return category?.name || "Unknown";
};
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <UiLabel>Category Splits</UiLabel>
      <UiButton type="button" variant="outline" size="sm" @click="addSplit">
        Add Split
      </UiButton>
    </div>

    <div v-for="(split, index) in localSplits" :key="index" class="flex gap-2 items-start">
      <div class="flex-1 space-y-2">
        <UiSelect v-model="split.categoryId">
          <UiSelectTrigger>
            <UiSelectValue :placeholder="split.categoryId ? getCategoryName(split.categoryId) : 'Select category'" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              <span v-if="category.icon" class="mr-2">{{ category.icon }}</span>
              {{ category.name }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <div class="w-32">
        <UiInput
          v-model.number="split.amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount"
          required
        />
      </div>

      <UiButton
        type="button"
        variant="ghost"
        size="icon"
        @click="removeSplit(index)"
      >
        ✕
      </UiButton>
    </div>

    <div v-if="localSplits.length > 0" class="text-sm space-y-1">
      <div class="flex justify-between">
        <span>Total Split Amount:</span>
        <span :class="isValid ? 'text-green-600' : 'text-red-600'">
          ${{ totalSplitAmount.toFixed(2) }}
        </span>
      </div>
      <div class="flex justify-between">
        <span>Transaction Amount:</span>
        <span>${{ Math.abs(totalAmount).toFixed(2) }}</span>
      </div>
      <div class="flex justify-between font-medium">
        <span>Remaining:</span>
        <span :class="isValid ? 'text-green-600' : 'text-red-600'">
          ${{ remainingAmount.toFixed(2) }}
        </span>
      </div>
    </div>
  </div>
</template>
