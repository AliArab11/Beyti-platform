using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddMembershipPlanSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "MembershipPlan",
                columns: new[] { "Id", "Name", "Description", "MonthlyPrice", "DurationDays", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    { 1, "Starter", "Free tier - Basic listing, up to 10 products, email support", 0.00m, 30, true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "Souq", "Featured listing, unlimited products, priority support, analytics", 15.00m, 30, true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "Partner", "Everything in Souq plus account manager, advanced analytics, API access", 35.00m, 30, true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MembershipPlan",
                keyColumn: "Id",
                keyValues: new object[] { 1, 2, 3 });
        }
    }
}
