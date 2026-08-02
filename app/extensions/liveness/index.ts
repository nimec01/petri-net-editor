import type { PetriNetExtension } from '~/types/extension';
import IconFlame from '~icons/tabler/flame';
import Liveness from '~/extensions/liveness/Liveness.vue';

const extension: PetriNetExtension = {
  id: 'built-in/liveness',
  name: 'Liveness Check',
  icon: IconFlame,
  run: (context) => {
    return defineComponent({
      setup() {
        return () => h(Liveness, { petriNet: context.net });
      },
    });
  },
};

export default extension;
