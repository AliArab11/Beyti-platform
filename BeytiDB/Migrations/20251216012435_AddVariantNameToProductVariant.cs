using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddVariantNameToProductVariant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VariantName",
                table: "ProductVariant",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VariantName",
                table: "ProductVariant");
        }
    }
}
