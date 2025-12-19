using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreSectionsAndVariantIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ProductVariant",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "StoreSectionId",
                table: "Product",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StoreSection",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SellerId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreSection", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoreSection_Seller_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Seller",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Product_StoreSectionId",
                table: "Product",
                column: "StoreSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_StoreSection_SellerId",
                table: "StoreSection",
                column: "SellerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Product_StoreSection_StoreSectionId",
                table: "Product",
                column: "StoreSectionId",
                principalTable: "StoreSection",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Product_StoreSection_StoreSectionId",
                table: "Product");

            migrationBuilder.DropTable(
                name: "StoreSection");

            migrationBuilder.DropIndex(
                name: "IX_Product_StoreSectionId",
                table: "Product");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ProductVariant");

            migrationBuilder.DropColumn(
                name: "StoreSectionId",
                table: "Product");
        }
    }
}
