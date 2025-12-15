using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("SellerSubCategory")]
[Index(nameof(SellerId), nameof(SubCategoryId), IsUnique = true)]
public class SellerSubCategory
{
    [Key]
    public int Id { get; set; }

    public int SellerId { get; set; }
    public int SubCategoryId { get; set; }

    [ForeignKey("SellerId")]
    public virtual Seller Seller { get; set; } = null!;

    [ForeignKey("SubCategoryId")]
    public virtual SubCategory SubCategory { get; set; } = null!;
}
