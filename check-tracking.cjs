const {PrismaClient} = require('./node_modules/@prisma/client')
const p = new PrismaClient()
async function run() {
  try {
    const v = await p.referralVisitor.count()
    const e = await p.referralTrackingEvent.count()
    console.log('Visitors:', v, 'Events:', e)
    if (e > 0) {
      const recent = await p.referralTrackingEvent.findMany({ take: 3, orderBy: { createdAt: 'desc' } })
      console.log('Recent:', JSON.stringify(recent))
    }
  } catch(err) {
    console.error('Error:', err.message)
  }
  await p.$disconnect()
}
run()
