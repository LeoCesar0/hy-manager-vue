<script setup lang="ts">
import { EditIcon, TrashIcon, EyeIcon } from "lucide-vue-next";

type IProps = {
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  editVariant?: "outline" | "ghost";
  deleteVariant?: "destructive" | "ghost";
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

const props = withDefaults(defineProps<IProps>(), {
  showView: false,
  showEdit: true,
  showDelete: true,
  editVariant: "outline",
  deleteVariant: "destructive",
});
</script>

<template>
  <div class="flex gap-2">
    <UiButton 
      v-if="showView" 
      variant="ghost" 
      size="icon" 
      title="Visualizar" 
      @click="onView"
    >
      <EyeIcon class="h-4 w-4" />
    </UiButton>
    
    <UiButton 
      v-if="showEdit" 
      :variant="editVariant" 
      size="icon" 
      title="Editar" 
      @click="onEdit"
    >
      <EditIcon class="h-4 w-4" />
    </UiButton>
    
    <UiButton 
      v-if="showDelete" 
      :variant="deleteVariant" 
      size="icon" 
      title="Deletar" 
      @click="onDelete"
    >
      <TrashIcon :class="deleteVariant === 'ghost' ? 'h-4 w-4 text-destructive' : 'h-4 w-4'" />
    </UiButton>
  </div>
</template>
