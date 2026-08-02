import type { PetriNetExtension } from '~/types/extension';
import IconFunction from '~icons/tabler/function';
import MathNotation from '~/extensions/math-notation/MathNotation.vue';

const extension: PetriNetExtension = {
  id: 'built-in/math-notation',
  name: 'Math Notation',
  icon: IconFunction,
  run: (context) => {
    return defineComponent({
      setup() {
        return () => h(MathNotation, { petriNet: context.net });
      },
    });
  },
};

export default extension;
