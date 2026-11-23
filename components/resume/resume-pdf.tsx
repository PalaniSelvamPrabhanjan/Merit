import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeDocument } from "@/lib/resume/document";

// ATS-safe classic template: one column, real text, standard headings, built-in
// Helvetica, no tables, images, headers or footers. Mirrors components/resume/resume-preview.tsx.
//
// ATS notes learned from text extraction (pdftotext):
// - No letter-spacing on headings: it makes some parsers read "EXPE RIENC E".
// - No automatic hyphenation: it split URLs ("avery-tan-ex- ample"). Long words wrap whole.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 44, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.35, color: "#111111" },
  name: { fontFamily: "Helvetica-Bold", fontSize: 20, lineHeight: 1.1 },
  headline: { fontSize: 10.5, marginTop: 3 },
  contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  contactItem: { fontSize: 9.5, color: "#222222" },
  section: { marginTop: 11 },
  heading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    textTransform: "uppercase",
    borderBottomWidth: 0.75,
    borderBottomColor: "#111111",
    paddingBottom: 2,
    marginBottom: 5
  },
  entry: { marginBottom: 5 },
  entryHead: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontFamily: "Helvetica-Bold", flexGrow: 1, flexShrink: 1, paddingRight: 8 },
  dates: { flexShrink: 0 },
  subtitle: { fontFamily: "Helvetica-Oblique" },
  bullet: { flexDirection: "row", marginTop: 1.5 },
  bulletMark: { width: 10 },
  bulletText: { flexGrow: 1, flexShrink: 1 }
});

export function ResumePdfDocument({ doc, title }: { doc: ResumeDocument; title: string }) {
  return (
    <Document author={doc.name} creator="Merit" producer="Merit" subject="Resume" title={title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{doc.name}</Text>
        {doc.headline ? <Text style={styles.headline}>{doc.headline}</Text> : null}
        {doc.contact.length ? (
          <View style={styles.contact}>
            {doc.contact.map((item, index) => (
              <Text key={item} style={styles.contactItem}>
                {index < doc.contact.length - 1 ? `${item}  |  ` : item}
              </Text>
            ))}
          </View>
        ) : null}

        {doc.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.text ? <Text>{section.text}</Text> : null}
            {section.entries.map((entry) => (
              <View key={entry.target} style={styles.entry} wrap={false}>
                {entry.title || entry.dates ? (
                  <View style={styles.entryHead}>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    {entry.dates ? <Text style={styles.dates}>{entry.dates}</Text> : null}
                  </View>
                ) : null}
                {entry.subtitle ? <Text style={styles.subtitle}>{entry.subtitle}</Text> : null}
                {entry.bullets.map((bullet) =>
                  section.id === "extras" || section.id === "education" ? (
                    <Text key={bullet.target}>{bullet.text}</Text>
                  ) : (
                    <View key={bullet.target} style={styles.bullet}>
                      <Text style={styles.bulletMark}>•</Text>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  )
                )}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
