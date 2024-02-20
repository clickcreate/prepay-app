<template>
  <div class="minusplusnumber">
    <div class="mpbtn minus" @click="mpminus()">-</div>
    <div class="inputNum">{{ newValue }}</div>
    <div class="mpbtn plus" @click="mpplus()">+</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PlusMinus',
  props: {
    value: {
      default: 0,
      type: Number,
    },
    min: {
      default: 0,
      type: Number,
    },
    max: {
      default: undefined,
      type: Number,
    },
  },

  data() {
    return {
      newValue: 0,
    };
  },

  methods: {
    mpplus: function () {
      if (this.max === undefined || this.newValue < this.max) {
        this.newValue = this.newValue + 1;
        this.$emit('input', this.newValue);
      }
    },
    mpminus: function () {
      if (this.newValue > this.min) {
        this.newValue = this.newValue - 1;
        this.$emit('input', this.newValue);
      }
    },
  },
  watch: {
    value: {
      handler: function (newVal, oldVal) {
        this.newValue = newVal;
      },
    },
  },
  created: function () {
    this.newValue = this.value;
  },
});
</script>
<style lang="scss" scoped>
.minusplusnumber {
  border: 1px solid #363535;
  border-radius: 5px;
  background-color: #363535;
  margin: 0 5px 0 5px;
  display: inline-block;
  user-select: none;
  font-size: 15px;
  vertical-align: middle;
}
.minusplusnumber div {
  display: table-cell;
  vertical-align: middle;
}
.minusplusnumber .inputNum {
  width: 100px;
  height: 40px;
  text-align: center;
  font-size: 18px;
  padding: 3px;
  border: none;
  background-color: #363535;
  color: #fff;
  appearance: none;
  -moz-appearance: textfield;
  -webkit-appearance: none;
  margin: 0;
  opacity: 1 !important;
  vertical-align: middle;
}
.minusplusnumber .mpbtn {
  padding: 3px 10px 3px 10px;
  cursor: pointer;
  border-radius: 5px;
}
.minusplusnumber .mpbtn:hover {
  background-color: #454343;
}
.minusplusnumber .mpbtn:active {
  background-color: #303030;
}
</style>
