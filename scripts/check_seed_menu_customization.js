const { PrismaClient } = require('@prisma/client')

;(async () => {
  const prisma = new PrismaClient()
  try {
    console.log('Checking for table menu_customizations...')
    const res = await prisma.$queryRawUnsafe("SELECT to_regclass('public.menu_customizations')::text as tbl")
    const tableName = Array.isArray(res) ? res[0].tbl : res.tbl
    if (!tableName) {
      console.error('Table menu_customizations does NOT exist.')
      process.exitCode = 2
      return
    }

    console.log('Table exists:', tableName)

    // Upsert a test record
    const userId = 'test-user-menu-customization'
    const testData = {
      sectionOrder: ['dashboard','business','financial','operations','system'],
      hiddenItems: ['admin/analytics'],
      practiceItems: [
        {
          id: 'practice-clients',
          name: 'Clients',
          icon: 'Users',
          href: '/admin/clients',
          order: 0,
          visible: true,
        },
      ],
      bookmarks: [
        {
          id: 'bookmark-1',
          name: 'Bookings',
          href: '/admin/bookings',
          icon: 'Calendar',
          order: 0,
        },
      ],
    }

    console.log('Upserting test record for userId=', userId)
    const upserted = await prisma.menuCustomization.upsert({
      where: { userId },
      update: {
        sectionOrder: testData.sectionOrder,
        hiddenItems: testData.hiddenItems,
        practiceItems: testData.practiceItems,
        bookmarks: testData.bookmarks,
      },
      create: {
        userId,
        sectionOrder: testData.sectionOrder,
        hiddenItems: testData.hiddenItems,
        practiceItems: testData.practiceItems,
        bookmarks: testData.bookmarks,
      },
    })

    console.log('Upsert successful. ID:', upserted.id)

    // Fetch and display the record
    const fetched = await prisma.menuCustomization.findUnique({ where: { userId } })
    console.log('Fetched record:', JSON.stringify(fetched, null, 2))
  } catch (err) {
    console.error('Error during check/seed:', err)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
})()
