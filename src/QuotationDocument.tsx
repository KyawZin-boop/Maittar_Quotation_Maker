import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer';
import { formatDisplayDate, formatMoney } from './format';
import type { QuoteData, QuoteItem } from './types';

Font.register({
  family: 'NotoMyanmar',
  fonts: [
    { src: '/NotoSansMyanmar-Regular.ttf', fontWeight: 400 },
    { src: '/NotoSansMyanmar-Regular.ttf', fontWeight: 700 }
  ]
});
Font.registerHyphenationCallback((word) => [word]);

const columns = [42, 216, 48, 45, 58, 80, 70];
const usesOnlyLatinCharacters = (value: string) => /^[\u0000-\u007f]*$/.test(value);

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 18,
    color: '#111111',
    fontFamily: 'NotoMyanmar',
    fontSize: 8.5
  },
  logo: {
    width: 520,
    height: 130,
    objectFit: 'contain',
    alignSelf: 'center',
    marginBottom: 10
  },
  contactBlock: {
    marginLeft: 112,
    marginBottom: 13
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 0
  },
  contactLabel: {
    width: 72,
    fontFamily: 'Helvetica',
    lineHeight: 1,
    fontWeight: 700
  },
  contactValue: {
    flex: 1,
    lineHeight: 1
  },
  projectBox: {
    borderWidth: 1,
    borderColor: '#111111',
    paddingVertical: 3,
    paddingHorizontal: 2
  },
  projectRow: {
    flexDirection: 'row',
    minHeight: 13
  },
  projectLabel: {
    width: 70,
    fontWeight: 700
  },
  projectValue: {
    flex: 1
  },
  table: {
    borderLeftWidth: 1,
    borderColor: '#111111'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  headerCell: {
    fontFamily: 'Helvetica',
    backgroundColor: '#8db4df',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#111111',
    minHeight: 24,
    paddingHorizontal: 3,
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 9,
    lineHeight: 1.05,
    textAlign: 'center'
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#111111',
    minHeight: 27,
    paddingHorizontal: 3,
    paddingVertical: 5,
    justifyContent: 'center',
    lineHeight: 1
  },
  cellText: {
    transform: [{ operation: 'translate', value: [0, 0.8] }]
  },
  latinCellText: {
    fontFamily: 'Helvetica'
  },
  centered: {
    textAlign: 'center'
  },
  numeric: {
    textAlign: 'right'
  },
  totalLabel: {
    backgroundColor: '#929292',
    fontWeight: 700,
    textAlign: 'center'
  },
  totalValue: {
    backgroundColor: '#929292',
    fontWeight: 700,
    textAlign: 'right'
  },
  allTotal: {
    flexDirection: 'row',
    backgroundColor: '#8667aa',
    color: '#111111',
    minHeight: 24,
    alignItems: 'center',
    fontWeight: 700,
    fontSize: 9.5
  },
  allTotalLabel: {
    width: 409,
    textAlign: 'center'
  },
  allTotalAmount: {
    width: 80,
    textAlign: 'right'
  },
  terms: {
    marginTop: 10,
    marginLeft: 40,
    lineHeight: 1.5
  },
  termHeading: {
    marginBottom: 5
  },
  warranty: {
    marginTop: 2
  },
  latinText: {
    fontFamily: 'Helvetica'
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  signature: {
    width: 160,
    textAlign: 'center',
    lineHeight: 0.8
  },
  signatureDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  continuationTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#0a9637'
  },
  continuationLogo: {
    width: 170,
    height: 38,
    objectFit: 'contain'
  },
  pageNumber: {
    position: 'absolute',
    bottom: 7,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666666',
    fontSize: 7
  },
  paymentPage: {
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 50,
    color: '#111111',
    fontFamily: 'NotoMyanmar',
    fontSize: 8.5
  },
  paymentLogo: {
    width: 300,
    height: 75,
    objectFit: 'contain',
    alignSelf: 'center',
    marginBottom: 8
  },
  paymentContactBlock: {
    marginLeft: 38,
    marginBottom: 16
  },
  paymentContactLabel: {
    width: 68,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    lineHeight: 1
  },
  paymentContactValue: {
    flex: 1,
    lineHeight: 1
  },
  paymentTitle: {
    marginBottom: 7,
    fontFamily: 'Helvetica',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center'
  },
  paymentTable: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#111111'
  },
  paymentNote: {
    minHeight: 72,
    paddingHorizontal: 22,
    paddingVertical: 12,
    justifyContent: 'center',
    backgroundColor: '#90c5ee',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#111111',
    textAlign: 'center',
    lineHeight: 0.65
  },
  paymentNoteMeta: {
    marginTop: 5,
    fontFamily: 'Helvetica',
    fontSize: 7.5
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  paymentCell: {
    minHeight: 28,
    paddingHorizontal: 5,
    paddingVertical: 5,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#111111',
    fontFamily: 'Helvetica',
    lineHeight: 1,
    textAlign: 'center'
  },
  paymentWorkCell: {
    width: 315,
    backgroundColor: '#90c5ee'
  },
  paymentPercentCell: {
    width: 75
  },
  paymentAmountCell: {
    width: 105,
    backgroundColor: '#ffd4a3',
    textAlign: 'right'
  },
  paymentSummaryLabel: {
    width: 390,
    backgroundColor: '#90c5ee',
    fontWeight: 700
  },
  paymentSummaryAmount: {
    width: 105,
    backgroundColor: '#a8e100',
    fontWeight: 700,
    textAlign: 'right'
  },
  paymentWarranty: {
    marginTop: 28,
    marginLeft: 10,
    fontFamily: 'Helvetica'
  },
  paymentSignatures: {
    marginTop: 72,
    paddingHorizontal: 35
  }
});

type Props = {
  data: QuoteData;
  logoUrl: string;
};

const chunkItems = (items: QuoteItem[]) => {
  const source = items.length ? items : [];
  const pages: QuoteItem[][] = [source.slice(0, 13)];
  for (let index = 13; index < source.length; index += 22) {
    pages.push(source.slice(index, index + 22));
  }
  return pages;
};

const HeaderRow = () => (
  <View style={styles.tableRow}>
    {['No', 'Particular', 'Qty', 'Unit', 'Rate', 'Amount', 'Remark'].map(
      (label, index) => (
        <View
          key={label}
          style={[
            styles.headerCell,
            { width: columns[index] },
            index === 1 ? { textAlign: 'left' } : {}
          ]}
        >
          <Text>{label}</Text>
        </View>
      )
    )}
  </View>
);

const ItemRow = ({ item, number }: { item: QuoteItem; number: number }) => {
  const amount = item.quantity * item.rate;
  const values = [
    String(number),
    item.particular || '—',
    formatMoney(item.quantity),
    item.unit,
    formatMoney(item.rate),
    formatMoney(amount),
    item.remark
  ];

  return (
    <View style={styles.tableRow} wrap={false}>
      {values.map((value, index) => (
        <View
          key={index}
          style={[
            styles.cell,
            { width: columns[index] }
          ]}
        >
          <Text
            style={[
              usesOnlyLatinCharacters(value) ? styles.latinCellText : styles.cellText,
              index === 0 || index === 2 || index === 3 ? styles.centered : {},
              index === 4 || index === 5 ? styles.numeric : {}
            ]}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
};

const Totals = ({ total }: { total: number }) => (
  <>
    <View style={styles.tableRow} wrap={false}>
      <View style={[styles.cell, styles.totalLabel, { width: 409 }]}>
        <Text>TOTAL</Text>
      </View>
      <View style={[styles.cell, styles.totalValue, { width: 80 }]}>
        <Text>{formatMoney(total)}</Text>
      </View>
      <View style={[styles.cell, styles.totalValue, { width: 70 }]} />
    </View>
    <View style={styles.allTotal} wrap={false}>
      <Text style={styles.allTotalLabel}>ALL TOTAL</Text>
      <Text style={styles.allTotalAmount}>{formatMoney(total)}</Text>
    </View>
  </>
);

const PaymentPage = ({
  data,
  logoUrl,
  total
}: {
  data: QuoteData;
  logoUrl: string;
  total: number;
}) => {
  const firstPayment = Math.round(total * 0.7);
  const secondPayment = Math.round(total * 0.2);
  const finalPayment = total - firstPayment - secondPayment;
  const discount = Math.max(0, Number(data.discount || 0));
  const netAmount = Math.max(0, total - discount);
  const milestones = [
    {
      label: 'After Copper Pipe and Drain Pipe Installation Work',
      percent: '70%',
      amount: firstPayment,
      color: '#ffd19a'
    },
    {
      label: 'After Indoor and Outdoor Installation Work',
      percent: '20%',
      amount: secondPayment,
      color: '#c9f5c8'
    },
    {
      label: 'After Test Run',
      percent: '10%',
      amount: finalPayment,
      color: '#f2c2ba'
    }
  ];

  return (
    <Page size="A4" style={styles.paymentPage}>
      <Image src={logoUrl} style={styles.paymentLogo} />
      <View style={styles.paymentContactBlock}>
        <View style={styles.contactRow}>
          <Text style={styles.paymentContactLabel}>Address</Text>
          <Text
            style={[
              styles.paymentContactValue,
              usesOnlyLatinCharacters(data.address) ? styles.latinText : {}
            ]}
          >
            {data.address}
          </Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.paymentContactLabel}>Engineer</Text>
          <Text
            style={[
              styles.paymentContactValue,
              usesOnlyLatinCharacters(data.engineerName) ? styles.latinText : {}
            ]}
          >
            {data.engineerName}
          </Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.paymentContactLabel}>Phone</Text>
          <Text
            style={[
              styles.paymentContactValue,
              usesOnlyLatinCharacters(data.phone) ? styles.latinText : {}
            ]}
          >
            {data.phone}
          </Text>
        </View>
      </View>

      <Text style={styles.paymentTitle}>Air-Con Installation Work</Text>
      <View style={styles.paymentTable}>
        <View style={styles.paymentNote}>
          <Text style={usesOnlyLatinCharacters(data.paymentNote) ? styles.latinText : {}}>
            {data.paymentNote}
          </Text>
          <Text style={styles.paymentNoteMeta}>
            {`Project: ${data.projectName || 'Untitled'}  |  Quotation Total: ${formatMoney(total)} MMK`}
          </Text>
        </View>

        {milestones.map((milestone) => (
          <View key={milestone.percent} style={styles.paymentRow} wrap={false}>
            <View style={[styles.paymentCell, styles.paymentWorkCell]}>
              <Text>{milestone.label}</Text>
            </View>
            <View
              style={[
                styles.paymentCell,
                styles.paymentPercentCell,
                { backgroundColor: milestone.color }
              ]}
            >
              <Text>{milestone.percent}</Text>
            </View>
            <View style={[styles.paymentCell, styles.paymentAmountCell]}>
              <Text>{formatMoney(milestone.amount)}</Text>
            </View>
          </View>
        ))}

        {[
          { label: 'Total', amount: total },
          ...(discount > 0 ? [{ label: 'Discount', amount: discount }] : []),
          { label: 'Net Amount', amount: netAmount }
        ].map((summary) => (
          <View key={summary.label} style={styles.paymentRow} wrap={false}>
            <View style={[styles.paymentCell, styles.paymentSummaryLabel]}>
              <Text>{summary.label}</Text>
            </View>
            <View style={[styles.paymentCell, styles.paymentSummaryAmount]}>
              <Text>{formatMoney(summary.amount)}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.paymentWarranty}>({data.warranty})</Text>

      <View style={styles.paymentSignatures}>
        <View style={styles.signatureRow}>
          <Text style={[styles.signature, styles.latinText]}>Customer Signature</Text>
          <Text style={[styles.signature, styles.latinText]}>Authorized&apos;s Signature</Text>
        </View>
        <View style={styles.signatureDetails}>
          <Text style={styles.signature}> </Text>
          <Text
            style={[
              styles.signature,
              usesOnlyLatinCharacters(`${data.engineerName}${data.phone}`)
                ? styles.latinText
                : {}
            ]}
          >
            {`${data.engineerName}\n${data.phone}`}
          </Text>
        </View>
      </View>
    </Page>
  );
};

export default function QuotationDocument({ data, logoUrl }: Props) {
  const pages = chunkItems(data.items);
  const total = data.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
    0
  );

  return (
    <Document
      title={`Maittar Quotation - ${data.projectName || 'Untitled'}`}
      author={data.engineerName}
      subject="Engineering quotation"
    >
      {pages.map((items, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;
        const startNumber = isFirst ? 1 : 14 + (pageIndex - 1) * 22;

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {isFirst ? (
              <>
                <Image src={logoUrl} style={styles.logo} />
                <View style={styles.contactBlock}>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>Address</Text>
                    <Text
                      style={[
                        styles.contactValue,
                        usesOnlyLatinCharacters(data.address) ? styles.latinText : {}
                      ]}
                    >
                      {data.address}
                    </Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>Engineer</Text>
                    <Text
                      style={[
                        styles.contactValue,
                        usesOnlyLatinCharacters(data.engineerName) ? styles.latinText : {}
                      ]}
                    >
                      {data.engineerName}
                    </Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text
                      style={[
                        styles.contactValue,
                        usesOnlyLatinCharacters(data.phone) ? styles.latinText : {}
                      ]}
                    >
                      {data.phone}
                    </Text>
                  </View>
                </View>
                <View style={styles.projectBox}>
                  <View style={styles.projectRow}>
                    <Text style={styles.projectLabel}>Project Name</Text>
                    <Text style={styles.projectValue}>{data.projectName || '—'}</Text>
                  </View>
                  <View style={styles.projectRow}>
                    <Text style={styles.projectLabel}>Date</Text>
                    <Text style={styles.projectValue}>{formatDisplayDate(data.date)}</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.continuationTitle}>
                <Image src={logoUrl} style={styles.continuationLogo} />
                <Text>{data.projectName} — continued</Text>
              </View>
            )}

            <View style={styles.table}>
              <HeaderRow />
              {items.map((item, index) => (
                <ItemRow key={item.id} item={item} number={startNumber + index} />
              ))}
              {isLast && <Totals total={total} />}
            </View>

            {isLast && (
              <>
                <View style={styles.terms}>
                  <Text style={styles.termHeading}>(Price Validity)</Text>
                  <Text style={usesOnlyLatinCharacters(data.validity) ? styles.latinText : {}}>
                    {data.validity}
                  </Text>
                  <Text
                    style={[
                      styles.warranty,
                      usesOnlyLatinCharacters(data.warranty) ? styles.latinText : {}
                    ]}
                  >
                    ({data.warranty})
                  </Text>
                </View>
              </>
            )}

            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                totalPages > 1 ? `${pageNumber} / ${totalPages}` : ''
              }
              fixed
            />
          </Page>
        );
      })}
      <PaymentPage data={data} logoUrl={logoUrl} total={total} />
    </Document>
  );
}
