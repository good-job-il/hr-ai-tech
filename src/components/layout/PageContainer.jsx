/**
 * Unified Page Container
 * Consistent max-width, padding, and spacing across all pages
 */
import { SPACING } from '@/theme/tokens';
import { cn } from '@/lib/utils';

export function PageContainer({ 
  children, 
  className,
  maxWidth = 'max-w-[1600px]',
  ...props 
}) {
  return (
    <div 
      className={cn('mx-auto', maxWidth, className)}
      style={{
        paddingLeft: SPACING[7],
        paddingRight: SPACING[7],
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageSection({ 
  children, 
  className,
  py = 20,
  ...props 
}) {
  return (
    <section 
      className={cn('w-full', className)}
      style={{
        paddingTop: SPACING[py],
        paddingBottom: SPACING[py],
      }}
      {...props}
    >
      {children}
    </section>
  );
}

export default PageContainer;