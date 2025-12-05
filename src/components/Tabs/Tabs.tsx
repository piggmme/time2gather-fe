import { Tabs as TabsRa } from "radix-ui";
import type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from '@radix-ui/react-tabs'
import styles from './Tabs.module.scss';

const TabsRoot = (props: TabsProps) => <TabsRa.Root {...props} className={styles.Root} />;
const TabsList = (props: TabsListProps) => <TabsRa.List {...props} className={styles.List} />;
const TabsTrigger = (props: TabsTriggerProps) => <TabsRa.Trigger {...props} className={styles.Trigger} />;
const TabsContent = (props: TabsContentProps) => <TabsRa.Content {...props} className={styles.Content} />;

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
};