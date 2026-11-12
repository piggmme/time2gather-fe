import type { CSSProperties } from 'react'
import type { AvailabilityDemoData } from '../marketing/availabilityDemo'
import styles from './AvailabilityDemo.module.scss'

export default function AvailabilityDemo ({ data }: { data: AvailabilityDemoData, compact?: boolean }) {
  const { small, medium, large } = data.images
  const ratios = {
    '--image-ratio-small': `${small.width} / ${small.height}`,
    '--image-ratio-medium': `${medium.width} / ${medium.height}`,
    '--image-ratio-large': `${large.width} / ${large.height}`,
  } as CSSProperties

  return (
    <section className={styles.demo} aria-labelledby='availability-demo-title' data-availability-demo>
      <div>
        <h2 id='availability-demo-title' className={styles.label}>{data.copy.sample}</h2>
        <p className={styles.result}>{data.copy.compactTime}{' '}<strong>{data.copy.compactResult}</strong></p>
      </div>
      <table className={styles.timetable} aria-label={data.copy.tableLabel}>
        <thead>
          <tr>
            <td />
            {data.days.map(day => <th key={day.key} scope='col' aria-label={day.label}>{day.short}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.exampleRows.map(row => (
            <tr key={row.hour}>
              <th scope='row'><bdi>{row.hour}</bdi></th>
              {row.counts.map((count, index) => (
                <td key={data.days[index].key} data-count={count}>
                  <span className={styles.srOnly}>{data.counts[count]}</span>
                  {count === 4 && <span aria-hidden='true'>✓</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <picture className={styles.picture} style={ratios}>
        <source media='(max-width: 359px)' srcSet={small.src} width={small.width} height={small.height} />
        <source media='(max-width: 800px)' srcSet={medium.src} width={medium.width} height={medium.height} />
        <img src={large.src} width={large.width} height={large.height} alt={data.imageAlt} loading='lazy' decoding='async' draggable={false} />
      </picture>
    </section>
  )
}
