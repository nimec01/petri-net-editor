import type { PetriNetExtension } from '~/types/extension';
import IconShare2 from '~icons/tabler/share-2';
import ReachabilityGraph from '~/extensions/reachability-graph/ReachabilityGraph.vue';

const extension: PetriNetExtension = {
  id: 'built-in/reachability-graph',
  name: 'Reachability Graph',
  icon: IconShare2,
  fullWidth: true,
  run: (context) => {
    return defineComponent({
      setup() {
        return () => h(ReachabilityGraph, { petriNet: context.net });
      },
    });
  },
};

export default extension;
