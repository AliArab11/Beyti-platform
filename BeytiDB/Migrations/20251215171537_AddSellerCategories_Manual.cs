using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    public partial class AddSellerCategories_Manual : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1️⃣ Add CategoryId to Seller
            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "Seller",
                type: "int",
                nullable: false,
                defaultValue: 1); // must exist

            // 2️⃣ Index
            migrationBuilder.CreateIndex(
                name: "IX_Seller_CategoryId",
                table: "Seller",
                column: "CategoryId");

            // 3️⃣ FK (RESTRICT, not cascade)
            migrationBuilder.AddForeignKey(
                name: "FK_Seller_Category_CategoryId",
                table: "Seller",
                column: "CategoryId",
                principalTable: "Category",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 4️⃣ Junction table
            migrationBuilder.CreateTable(
                name: "SellerSubCategory",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SellerId = table.Column<int>(nullable: false),
                    SubCategoryId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerSubCategory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SellerSubCategory_Seller",
                        column: x => x.SellerId,
                        principalTable: "Seller",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SellerSubCategory_SubCategory",
                        column: x => x.SubCategoryId,
                        principalTable: "SubCategory",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SellerSubCategory_SellerId_SubCategoryId",
                table: "SellerSubCategory",
                columns: new[] { "SellerId", "SubCategoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerSubCategory_SubCategoryId",
                table: "SellerSubCategory",
                column: "SubCategoryId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SellerSubCategory");

            migrationBuilder.DropForeignKey(
                name: "FK_Seller_Category_CategoryId",
                table: "Seller");

            migrationBuilder.DropIndex(
                name: "IX_Seller_CategoryId",
                table: "Seller");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Seller");
        }
    }
}
