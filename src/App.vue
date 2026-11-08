<script setup>
import { ref } from 'vue'
import { OPERATIONS, calculate } from './calc.js'

// The inputs are kept as the raw strings the browser gives us (not v-model,
// which casts type="number" inputs to floats) so the maths stays exact.
const first = ref('')
const second = ref('')
const operation = ref('+')
const result = ref('')
const error = ref('')

function onCalculate() {
  try {
    result.value = calculate(first.value, second.value, operation.value)
    error.value = ''
  } catch (e) {
    result.value = ''
    error.value = e.message
  }
}
</script>

<template>
  <main class="calculator">
    <h1>Calculator</h1>

    <form @submit.prevent="onCalculate" novalidate>
      <label for="first">First number</label>
      <input
        id="first"
        type="number"
        step="any"
        inputmode="decimal"
        :value="first"
        @input="first = $event.target.value"
      />

      <label for="operation">Action</label>
      <select id="operation" v-model="operation">
        <option v-for="op in OPERATIONS" :key="op" :value="op">{{ op }}</option>
      </select>

      <label for="second">Second number</label>
      <input
        id="second"
        type="number"
        step="any"
        inputmode="decimal"
        :value="second"
        @input="second = $event.target.value"
      />

      <button id="calculate" type="submit">=</button>

      <span class="result-label" aria-hidden="true">Result</span>
      <output id="result" for="first operation second" aria-live="polite">{{ result }}</output>
    </form>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </main>
</template>
